const express = require('express')
const router = express.Router()
const purchasesController = require('../controllers/purchases.controller')
const { ensureAuth } = require('../middleware/ensureAuth')

router.get('/', ensureAuth, purchasesController.getPurchases)
router.post('/makePurchase', purchasesController.makePurchase)

router.post('/editGoal', purchasesController.editGoal)

router.delete('/removePurchase/:id', purchasesController.removePurchase)
router.delete('/removeAllPurchases/:id', purchasesController.removeAllPurchases)


module.exports = router