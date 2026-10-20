const FAQ = require("../models/FAQ");

// Create a new FAQ (admin only)
const createFAQ = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    const faq = new FAQ({
      title,
      description,
      createdBy: req.user.userId,
    });

    await faq.save();

    res.status(201).json({ message: "FAQ created successfully", faq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating FAQ" });
  }
};

// Get all FAQs (public)
const getFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    res.status(200).json(faqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching FAQs" });
  }
};

// Update an FAQ (admin only)
const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    if (title) faq.title = title;
    if (description) faq.description = description;

    await faq.save();

    res.status(200).json({ message: "FAQ updated successfully", faq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating FAQ" });
  }
};

// Delete an FAQ (admin only)
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findById(id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    await faq.deleteOne();

    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting FAQ" });
  }
};

module.exports = { createFAQ, getFAQs, updateFAQ, deleteFAQ };
