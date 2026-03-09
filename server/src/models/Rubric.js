import mongoose from "mongoose";

const rubricSchema = new mongoose.Schema({
  // e.g. "teaching", "non_teaching", "teaching_related"
  category: { type: String, required: true, unique: true },
  
  title: String,
  criteria: [
    {
      key: String,       // maps to hrRating field
      label: String,     // display label
      maxPoints: Number,
      subCriteria: [
        {
          key: String,
          label: String,
          maxPoints: Number
        }
      ]
    }
  ],
  
  totalPoints: { type: Number, default: 100 },
  active: { type: Boolean, default: true }
});

export default mongoose.model("Rubric", rubricSchema);
