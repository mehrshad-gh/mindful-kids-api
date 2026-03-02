const express = require('express');
const authRoutes = require('./auth');
const childrenRoutes = require('./children');
const activitiesRoutes = require('./activities');
const adviceRoutes = require('./advice');
const psychologistsRoutes = require('./psychologists');
const reviewsRoutes = require('./reviews');
const progressRoutes = require('./progress');
const emotionLogsRoutes = require('./emotionLogs');
const therapistRoutes = require('./therapist');
const adminRoutes = require('./admin');
const clinicAdminRoutes = require('./clinicAdmin');
const clinicsRoutes = require('./clinics');
const clinicApplicationsRoutes = require('./clinicApplications');
const reportsRoutes = require('./reports');
const searchRoutes = require('./search');
const contentRoutes = require('./content');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/children', childrenRoutes);
router.use('/activities', activitiesRoutes);
router.use('/advice', adviceRoutes);
router.use('/psychologists', psychologistsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/progress', progressRoutes);
router.use('/emotion-logs', emotionLogsRoutes);
router.use('/therapist', therapistRoutes);
router.use('/admin', adminRoutes);
router.use('/clinic-admin', clinicAdminRoutes);
router.use('/clinics', clinicsRoutes);
router.use('/clinic-applications', clinicApplicationsRoutes);
router.use('/reports', reportsRoutes);
router.use('/search', searchRoutes);
router.use('/content', contentRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
