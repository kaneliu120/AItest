export type SkillEvalWeights = {
  documentation: number;
  structure: number;
  testing: number;
  security: number;
  maintainability: number;
};

export const defaultSkillEvalWeights: SkillEvalWeights = {
  documentation: 30,
  structure: 25,
  testing: 20,
  security: 15,
  maintainability: 10,
};

function normalize(weights: SkillEvalWeights): SkillEvalWeights {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 100;
  if (total === 100) return weights;
  return {
    documentation: Math.round((weights.documentation / total) * 100),
    structure: Math.round((weights.structure / total) * 100),
    testing: Math.round((weights.testing / total) * 100),
    security: Math.round((weights.security / total) * 100),
    maintainability: Math.round((weights.maintainability / total) * 100),
  };
}

export function getSkillEvalWeights(): SkillEvalWeights {
  const raw: SkillEvalWeights = {
    documentation: Number(process.env.SKILL_EVAL_WEIGHT_DOCUMENTATION || defaultSkillEvalWeights.documentation),
    structure: Number(process.env.SKILL_EVAL_WEIGHT_STRUCTURE || defaultSkillEvalWeights.structure),
    testing: Number(process.env.SKILL_EVAL_WEIGHT_TESTING || defaultSkillEvalWeights.testing),
    security: Number(process.env.SKILL_EVAL_WEIGHT_SECURITY || defaultSkillEvalWeights.security),
    maintainability: Number(process.env.SKILL_EVAL_WEIGHT_MAINTAINABILITY || defaultSkillEvalWeights.maintainability),
  };
  return normalize(raw);
}
