import { Router, RequestHandler } from 'express';
import { dealsService, CreateDealInput, UpdateDealInput } from '../services/deals';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

const router = Router();

// Validation helpers
const validateRequiredFields = (data: any, fields: string[]): string[] | null => {
  const missing = fields.filter(field => !data[field] || data[field].toString().trim() === '');
  return missing.length > 0 ? missing : null;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get all deals for tenant
const getAllDeals: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId, userId } = req.user;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const deals = await dealsService.getDealsByTenant(tenantId, includeDeleted);

    res.json({ 
      data: deals,
      total: deals.length,
      message: `Retrieved ${deals.length} deals`
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get deal by ID
const getDealById: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }
    
    const deal = await dealsService.getDealById(id, tenantId);
    
    if (!deal) {
      res.status(404).json({ message: "Deal not found" });
      return;
    }

    res.json({ data: deal });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ message: "Internal server error" });
    }
};

// Get deals by owner
const getDealsByOwner: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId } = req.user;
    const { owner } = req.params;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const deals = await dealsService.getDealsByOwner(owner, tenantId);
    
    res.json({ 
      data: deals,
      total: deals.length 
    });
  } catch (error) {
    console.error('Get deals by owner error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get deals by stage
const getDealsByStage: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId } = req.user;
    const { stage } = req.params;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const deals = await dealsService.getDealsByStage(stage, tenantId);
    
    res.json({ 
      data: deals,
      total: deals.length 
    });
  } catch (error) {
    console.error('Get deals by stage error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Search deals
const searchDeals: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId } = req.user;
    const { q } = req.query;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: "Search query required" });
      return;
    }

    const deals = await dealsService.searchDeals(tenantId, q);
    
    res.json({ 
      data: deals,
      total: deals.length,
      query: q
    });
  } catch (error) {
    console.error('Search deals error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new deal
const createDeal: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId, userId } = req.user;
    
    if (!tenantId || !userId) {
      res.status(400).json({ error: "User authentication required" });
      return;
    }

    // Validate required fields
    const requiredFields = ['dealOwner', 'dealName', 'leadSource', 'stage', 'amount'];
    const missingFields = validateRequiredFields(req.body, requiredFields);
    
    if (missingFields) {
      res.status(400).json({ 
        error: "Missing required fields", 
        missingFields 
      });
      return;
    }

    // Validate amount is a number
    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount < 0) {
      res.status(400).json({ error: "Amount must be a valid positive number" });
      return;
    }

    const dealInput: CreateDealInput = {
      dealOwner: req.body.dealOwner,
      dealName: req.body.dealName,
      leadSource: req.body.leadSource,
      stage: req.body.stage,
      amount: amount,
      description: req.body.description,
      account: req.body.account,
      probability: req.body.probability ? Number(req.body.probability) : undefined,
      closeDate: req.body.closeDate
    };

    const deal = await dealsService.createDeal(dealInput, userId, req.user.email, tenantId);

    res.status(201).json({ 
      message: "Deal created successfully", 
      data: deal 
    });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update deal
const updateDeal: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    
    if (!tenantId || !userId) {
      res.status(400).json({ error: "User authentication required" });
      return;
    }

    // Validate amount if provided
    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount < 0) {
        res.status(400).json({ error: "Amount must be a valid positive number" });
        return;
      }
      req.body.amount = amount;
    }
    
    // Validate probability if provided
    if (req.body.probability !== undefined) {
      const probability = Number(req.body.probability);
      if (isNaN(probability) || probability < 0 || probability > 100) {
        res.status(400).json({ error: "Probability must be a number between 0 and 100" });
        return;
      }
      req.body.probability = probability;
    }

    const updateInput: UpdateDealInput = {};
    
    // Only include fields that are provided in the request
    const updateableFields = [
      'dealOwner', 'dealName', 'leadSource', 'stage', 'amount', 
      'description', 'account', 'probability', 'closeDate'
    ];

    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateInput[field as keyof UpdateDealInput] = req.body[field];
    }
    });

    const updatedDeal = await dealsService.updateDeal(id, updateInput, userId, req.user.email, tenantId);
    
    if (!updatedDeal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    res.json({ 
      message: "Deal updated successfully", 
      data: updatedDeal 
    });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Soft delete deal
const deleteDeal: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    
    if (!tenantId || !userId) {
      res.status(400).json({ error: "User authentication required" });
      return;
    }

    const success = await dealsService.deleteDeal(id, userId, req.user.email, tenantId);
    
    if (!success) {
      res.status(404).json({ error: "Deal not found or already deleted" });
      return;
    }

    res.json({ message: "Deal deleted successfully" });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Restore soft deleted deal
const restoreDeal: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    
    if (!tenantId || !userId) {
      res.status(400).json({ error: "User authentication required" });
      return;
    }

    const success = await dealsService.restoreDeal(id, userId, req.user.email, tenantId);
    
    if (!success) {
      res.status(404).json({ error: "Deal not found or not deleted" });
      return;
    }

    res.json({ message: "Deal restored successfully" });
  } catch (error) {
    console.error('Restore deal error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Hard delete deal (permanent)
const hardDeleteDeal: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId, userId, role } = req.user;
    const { id } = req.params;
    
    if (!tenantId || !userId) {
      res.status(400).json({ error: "User authentication required" });
      return;
    }

    // Only admins can perform hard delete
    if (role !== 'admin' && role !== 'superadmin') {
      res.status(403).json({ error: "Insufficient permissions for hard delete" });
      return;
    }

    const success = await dealsService.hardDeleteDeal(id, tenantId);
    
    if (!success) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    res.json({ message: "Deal permanently deleted" });
  } catch (error) {
    console.error('Hard delete deal error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get deals statistics
const getDealsStats: RequestHandler = async (req: any, res) => {
  try {
    const { tenantId } = req.user;
    
    if (!tenantId) {
      res.status(400).json({ error: "Tenant ID required" });
      return;
    }

    const stats = await dealsService.getDealsStats(tenantId);
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Get deals stats error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Routes
router.get('/', getAllDeals);
router.get('/stats', getDealsStats);
router.get('/search', searchDeals);
router.get('/owner/:owner', getDealsByOwner);
router.get('/stage/:stage', getDealsByStage);
router.get('/:id', getDealById);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);
router.post('/:id/restore', restoreDeal);
router.delete('/:id/hard', hardDeleteDeal);

export default router;
