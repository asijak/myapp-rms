import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    systemName:    { type: String, default: "DepEd GHC" },
    systemSubName: { type: String, default: "RSP Portal" },
    copyrightText: { type: String, default: "DepEd Division of Guihulngan City" },
    logoUrl:       { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("SystemSettings", systemSettingsSchema);
