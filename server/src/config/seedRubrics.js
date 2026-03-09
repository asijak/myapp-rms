import Rubric from "../models/Rubric.js";

export const seedRubrics = async () => {
  const counts = await Rubric.countDocuments();
  if (counts > 0) return;

  const seeds = [
    {
      category: "non_teaching",
      title: "Non-Teaching Personnel Rubric",
      criteria: [
        { key: "educationPoints", label: "Education", maxPoints: 5 },
        { key: "trainingPoints", label: "Training", maxPoints: 5 },
        { key: "experiencePoints", label: "Experience", maxPoints: 20 },
        { key: "performancePoints", label: "Performance", maxPoints: 20 },
        { key: "outstandingAccomplishments", label: "Outstanding Accomplishments", maxPoints: 5 },
        { key: "appEducationPoints", label: "Application of Education", maxPoints: 10 },
        { key: "appLearningPoints", label: "Application of L&D", maxPoints: 10 },
        { key: "potentialPoints.bei", label: "Potential (BEI)", maxPoints: 25 }
      ]
    },
    {
      category: "teaching",
      title: "Teaching Personnel Rubric (Teacher I)",
      criteria: [
        { key: "educationPoints", label: "Education", maxPoints: 20 },
        { key: "trainingPoints", label: "Training", maxPoints: 10 },
        { key: "experiencePoints", label: "Experience", maxPoints: 10 },
        { key: "potentialPoints.writtenTest", label: "LET/PBET Rating", maxPoints: 15 },
        { key: "potentialPoints.workSample", label: "Classroom Observation (Demo)", maxPoints: 35 },
        { key: "potentialPoints.bei", label: "Interview", maxPoints: 10 }
      ]
    }
  ];

  await Rubric.insertMany(seeds);
  console.log("✅ Rubrics Seeded");
};
