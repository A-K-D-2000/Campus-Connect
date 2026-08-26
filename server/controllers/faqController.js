const FAQ = require('../models/FAQ');

// Create a new FAQ (admin only)
const createFAQ = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ message: 'Title, category, and description are required' });
    }

    const faq = new FAQ({
      title,
      category,
      description,
      createdBy: req.user.userId,
    });

    await faq.save();

    res.status(201).json({ message: 'FAQ created successfully', faq });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating FAQ' });
  }
};

// Get all FAQs (public)
const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    res.status(200).json(faqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching FAQs' });
  }
};

module.exports = { createFAQ, getFAQs };