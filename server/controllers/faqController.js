const FAQ = require("../models/FAQ");
const { uploadFiles } = require('../utils/uploadToCloudinary');

// Create a new FAQ (admin only)
const createFAQ = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    const attachments = await uploadFiles(req.files, 'campus-connect/faqs');

    const faq = new FAQ({
      title,
      description,
      attachments,
      createdBy: req.user.userId,
    });

    await faq.save();

    res.status(201).json({ message: "FAQ created successfully", faq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating FAQ" });
  }
};

// Escape special characters so a search term is treated as plain text
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Get all FAQs, or search them with ?q= (public)
const getFAQs = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);

    // No search term: return everything, newest first
    if (!q) {
      const faqs = await FAQ.find().populate('createdBy', 'username').sort({ createdAt: -1 });
      return res.status(200).json(faqs);
    }

    let results;
    try {
      results = await FAQ.aggregate([
        {
          $search: {
            index: 'faq_search',
            compound: {
              should: [
                {
                  text: {
                    query: q,
                    path: 'title',
                    fuzzy: { maxEdits: 1, prefixLength: 2 },
                    score: { boost: { value: 3 } },
                  },
                },
                {
                  text: {
                    query: q,
                    path: 'description',
                    fuzzy: { maxEdits: 1, prefixLength: 2 },
                  },
                },
              ],
              minimumShouldMatch: 1,
            },
          },
        },
        { $limit: 20 },
        { $addFields: { score: { $meta: 'searchScore' } } },
      ]);
    } catch (searchErr) {
      // If Atlas Search itself fails, fall back to a simple match so the page still works
      console.warn('Atlas Search failed, using fallback:', searchErr.message);
      const rx = new RegExp(escapeRegex(q), 'i');
      results = await FAQ.find({ $or: [{ title: rx }, { description: rx }] })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    const populated = await FAQ.populate(results, { path: 'createdBy', select: 'username' });
    res.status(200).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching FAQs' });
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

        const isOwner = faq.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage FAQs you created' });
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

        const isOwner = faq.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage FAQs you created' });
    }

    await faq.deleteOne();

    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting FAQ" });
  }
};

module.exports = { createFAQ, getFAQs, updateFAQ, deleteFAQ };
