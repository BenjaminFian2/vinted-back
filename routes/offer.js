const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

const User = require("../models/User");
const Offer = require("../models/Offer");

router.get("/offers", async (req, res) => {
  try {
    let { page, title, priceMin, priceMax, sort, limit } = req.query;
    const filter = {};
    if (title) {
      filter.product_name = new RegExp(title, "i");
    }
    if (priceMin || priceMax) {
      filter.product_price = {};
      if (priceMax) {
        filter.product_price.$lte = Number(priceMax);
      }
      if (priceMin) {
        filter.product_price.$gte = Number(priceMin);
      }
    }
    if (sort) {
      sort = { product_price: sort.replace("price-", "") };
    }
    if (!limit || Number(limit) < 1) {
      limit = 5;
    }
    if (!page || Number(page) < 1) {
      page = 1;
    }
    const offers = await Offer.find(filter)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip(Number(limit) * (Number(page) - 1))
      .limit(Number(limit));
    //.select("product_name product_price");

    const count = await Offer.countDocuments(filter);

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });
    if (req.files.picture) {
      newOffer.product_image = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: `/vinted/offers/${newOffer._id}`,
        }
      );
    }
    await newOffer.save();
    res.status(200).json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;
    const offer = await Offer.findById(req.params.id);
    if (req.files.picture) {
      if (offer.product_image) {
        console.log("bc");
        await cloudinary.uploader.destroy(offer.product_image.public_id);
        console.log("ac");
      }
      offer.product_image = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: `/vinted/offers/${offer._id}`,
        }
      );
    }
    offer.product_name = title;
    offer.product_description = description;
    offer.product_price = price;
    offer.product_details = [
      { MARQUE: brand },
      { TAILLE: size },
      { ÉTAT: condition },
      { COULEUR: color },
      { EMPLACEMENT: city },
    ];
    await offer.save();
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (offer.product_image) {
      await cloudinary.uploader.destroy(offer.product_image.public_id);
      await cloudinary.api.delete_folder(`/vinted/offers/${offer._id}`);
    }
    res.status(200).json("The offer has been deleted");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
