import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate numeric ID before saving
categorySchema.pre("save", async function (next) {
  if (this.isNew && !this.categoryId) {
    try {
      const maxCategory = await mongoose
        .model("Category")
        .findOne()
        .sort({ categoryId: -1 })
        .select("categoryId");
      this.categoryId =
        maxCategory && maxCategory.categoryId ? maxCategory.categoryId + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Generate slug from name before saving
categorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");
  }
  next();
});

export default mongoose.model("Category", categorySchema);
