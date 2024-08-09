const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/login', viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/historic', authController.protect, viewsController.getHistoric);
router.get('/register', viewsController.getRegister);
router.get('/requests', viewsController.getRequests);
router.get('/forgot-password', viewsController.getForgotPassword);
router.get('/analytics', viewsController.getMain);
router.get('/suport', viewsController.getSuport);
router.get('/resetPassword/:token', viewsController.resetPassword);

// router.post(
//   '/submit-user-data',
//   authController.protect,
//   viewsController.updateUserData
// );

module.exports = router;
