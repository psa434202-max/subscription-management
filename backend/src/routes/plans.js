const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/SubscriptionPlan');
const { authenticate, checkRole } = require('../middleware/auth');

// GET /api/plans - List all active plans or filtered
router.get('/', async (req, res) => {
  try {
    const { frequency, search, category, activeOnly = 'true' } = req.query;
    const filter = {};

    if (activeOnly === 'true') {
      filter.isActive = true;
    }
    if (frequency) filter.billingFrequency = frequency;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { features: { $regex: search, $options: 'i' } }
      ];
    }

    const plans = await SubscriptionPlan.find(filter)
      .populate('products.product')
      .sort({ price: 1 });

    return res.json({ success: true, count: plans.length, plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
});

// GET /api/plans/compare - Compare specific plans by IDs
router.get('/compare', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, message: 'Please provide comma-separated plan IDs to compare' });
    }

    const planIds = ids.split(',').filter(Boolean).slice(0, 4); // Max 4 plans
    const plans = await SubscriptionPlan.find({ _id: { $in: planIds } }).populate('products.product');

    // Aggregate all distinct features across the compared plans
    const allFeaturesSet = new Set();
    plans.forEach(plan => {
      (plan.features || []).forEach(feat => allFeaturesSet.add(feat));
    });
    const allFeatures = Array.from(allFeaturesSet);

    // Build comparison matrix
    const comparisonMatrix = plans.map(plan => {
      const featureMap = {};
      allFeatures.forEach(feat => {
        featureMap[feat] = (plan.features || []).some(
          f => f.toLowerCase().trim() === feat.toLowerCase().trim()
        );
      });

      return {
        _id: plan._id,
        name: plan.name,
        code: plan.code,
        price: plan.price,
        billingFrequency: plan.billingFrequency,
        monthlyEquivalent: plan.monthlyEquivalentPrice,
        annualEquivalent: plan.annualEquivalentPrice,
        minimumQuantity: plan.minimumQuantity,
        features: plan.features,
        featureMap,
        allowPause: plan.allowPause,
        allowEarlyClosure: plan.allowEarlyClosure,
        autoRenewal: plan.autoRenewal,
        category: plan.category,
        products: plan.products
      };
    });

    return res.json({
      success: true,
      allFeatures,
      plans: comparisonMatrix
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to compare plans' });
  }
});

// POST /api/plans/recommend - Smart Plan Recommendation ("Find My Best Plan")
router.post('/recommend', async (req, res) => {
  try {
    const { budget, requiredFeatures = [], billingFrequency, productQuantity = 1 } = req.body;

    const query = { isActive: true };
    if (billingFrequency && billingFrequency !== 'any') {
      query.billingFrequency = billingFrequency;
    }

    const allPlans = await SubscriptionPlan.find(query).populate('products.product');

    const scoredPlans = allPlans.map(plan => {
      let score = 100;
      const reasons = [];

      // Budget check
      const monthlyBudget = Number(budget) || Infinity;
      const planMonthlyCost = plan.monthlyEquivalentPrice * Math.max(productQuantity, plan.minimumQuantity);

      if (planMonthlyCost <= monthlyBudget) {
        score += 30;
        reasons.push(`Within your monthly budget of ₹${monthlyBudget} (estimated monthly cost: ₹${Math.round(planMonthlyCost)})`);
      } else {
        const overBudgetPercent = ((planMonthlyCost - monthlyBudget) / monthlyBudget) * 100;
        score -= Math.min(60, overBudgetPercent * 0.8);
        reasons.push(`Exceeds your monthly budget by ₹${Math.round(planMonthlyCost - monthlyBudget)}`);
      }

      // Feature match check
      const matchedFeatures = [];
      const missingFeatures = [];

      requiredFeatures.forEach(reqFeat => {
        const hasFeature = (plan.features || []).some(pf =>
          pf.toLowerCase().includes(reqFeat.toLowerCase()) || reqFeat.toLowerCase().includes(pf.toLowerCase())
        );
        if (hasFeature) {
          matchedFeatures.push(reqFeat);
        } else {
          missingFeatures.push(reqFeat);
        }
      });

      if (requiredFeatures.length > 0) {
        const matchRatio = matchedFeatures.length / requiredFeatures.length;
        score += matchRatio * 50;
        if (matchedFeatures.length > 0) {
          reasons.push(`Supports ${matchedFeatures.length}/${requiredFeatures.length} required features: ${matchedFeatures.join(', ')}`);
        }
        if (missingFeatures.length > 0) {
          reasons.push(`Lacks: ${missingFeatures.join(', ')}`);
        }
      } else {
        score += 20;
      }

      // Quantity suitability
      if (productQuantity >= plan.minimumQuantity) {
        score += 10;
        reasons.push(`Meets minimum quantity requirement of ${plan.minimumQuantity}`);
      } else {
        score -= 15;
        reasons.push(`Requires minimum quantity of ${plan.minimumQuantity}`);
      }

      // Popularity boost
      if (plan.isPopular) {
        score += 5;
        reasons.push('Most popular choice among Brightloop customers');
      }

      return {
        plan,
        score: Math.max(0, Math.round(score)),
        estimatedMonthlyCost: Math.round(planMonthlyCost),
        matchedFeatures,
        missingFeatures,
        reasons,
        isAffordable: planMonthlyCost <= monthlyBudget
      };
    });

    // Sort by score descending
    scoredPlans.sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      recommendations: scoredPlans
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
});

// POST /api/plans/savings-calculator - Calculate savings between current and alternative plan
router.post('/savings-calculator', async (req, res) => {
  try {
    const { currentPlanId, alternativePlanId, quantity = 1 } = req.body;

    const [currentPlan, altPlan] = await Promise.all([
      SubscriptionPlan.findById(currentPlanId),
      SubscriptionPlan.findById(alternativePlanId)
    ]);

    if (!currentPlan || !altPlan) {
      return res.status(404).json({ success: false, message: 'One or both plans not found' });
    }

    const currentMonthly = currentPlan.monthlyEquivalentPrice * quantity;
    const altMonthly = altPlan.monthlyEquivalentPrice * quantity;

    const currentAnnual = currentPlan.annualEquivalentPrice * quantity;
    const altAnnual = altPlan.annualEquivalentPrice * quantity;

    const monthlySavings = currentMonthly - altMonthly;
    const annualSavings = currentAnnual - altAnnual;

    return res.json({
      success: true,
      currentPlan: {
        _id: currentPlan._id,
        name: currentPlan.name,
        price: currentPlan.price,
        billingFrequency: currentPlan.billingFrequency,
        monthlyEquivalent: Math.round(currentMonthly),
        annualEquivalent: Math.round(currentAnnual)
      },
      alternativePlan: {
        _id: altPlan._id,
        name: altPlan.name,
        price: altPlan.price,
        billingFrequency: altPlan.billingFrequency,
        monthlyEquivalent: Math.round(altMonthly),
        annualEquivalent: Math.round(altAnnual)
      },
      analysis: {
        isCheaper: altMonthly < currentMonthly,
        monthlySavings: Math.round(monthlySavings),
        annualSavings: Math.round(annualSavings),
        percentageSavings: currentMonthly > 0 ? Math.round(((monthlySavings) / currentMonthly) * 100) : 0,
        explanation: altMonthly < currentMonthly
          ? `Switching to ${altPlan.name} will save you approximately ₹${Math.abs(Math.round(monthlySavings))} per month (₹${Math.abs(Math.round(annualSavings))} per year)!`
          : `Upgrading to ${altPlan.name} will add approximately ₹${Math.abs(Math.round(monthlySavings))} per month with enhanced features.`
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to calculate savings' });
  }
});

// GET /api/plans/:id - Single plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id).populate('products.product');
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    return res.json({ success: true, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plan' });
  }
});

// POST /api/plans - Create plan (Admin only)
router.post('/', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      category,
      billingFrequency,
      price,
      minimumQuantity,
      products,
      features,
      availabilityStartDate,
      availabilityEndDate,
      autoRenewal,
      allowPause,
      allowEarlyClosure,
      autoClosureAfterDays,
      isPopular
    } = req.body;

    if (!name || !code || price === undefined || !billingFrequency) {
      return res.status(400).json({ success: false, message: 'Name, code, price, and billing frequency are required' });
    }

    const existing = await SubscriptionPlan.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A plan with this code already exists' });
    }

    const plan = new SubscriptionPlan({
      name,
      code: code.toUpperCase(),
      description,
      category: category || 'Standard',
      billingFrequency,
      price: Number(price),
      minimumQuantity: Number(minimumQuantity || 1),
      products: Array.isArray(products) ? products : [],
      features: Array.isArray(features) ? features : [],
      availabilityStartDate: availabilityStartDate || new Date(),
      availabilityEndDate,
      autoRenewal: autoRenewal !== undefined ? autoRenewal : true,
      allowPause: allowPause !== undefined ? allowPause : true,
      allowEarlyClosure: allowEarlyClosure !== undefined ? allowEarlyClosure : true,
      autoClosureAfterDays: Number(autoClosureAfterDays || 0),
      isPopular: !!isPopular
    });

    await plan.save();
    return res.status(201).json({ success: true, message: 'Plan created successfully', plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create plan' });
  }
});

// PUT /api/plans/:id - Update plan (Admin only)
router.put('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    Object.assign(plan, req.body);
    if (req.body.price !== undefined) plan.price = Number(req.body.price);
    if (req.body.minimumQuantity !== undefined) plan.minimumQuantity = Number(req.body.minimumQuantity);

    await plan.save();
    return res.json({ success: true, message: 'Plan updated successfully', plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
});

// DELETE /api/plans/:id - Deactivate plan (Admin only)
router.delete('/:id', authenticate, checkRole('admin'), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    plan.isActive = false;
    await plan.save();
    return res.json({ success: true, message: 'Plan deactivated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to deactivate plan' });
  }
});

module.exports = router;

