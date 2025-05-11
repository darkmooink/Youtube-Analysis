import { BuildOptions, CreationAttributes, DataTypes, Model, ModelStatic } from 'sequelize';
import sequelize from './sequalise';
import { Moderation, Moderations } from 'openai/resources/moderations';

export class OpenAIModerationResult extends Model {
    public flagged!: boolean;
    public targetType!: string;
    public targetId!: string;
    public raw!: object;
    public sexual!: boolean;
    public sexual_minors!: boolean;
    public harassment!: boolean;
    public harassment_threatening!: boolean;
    public hate!: boolean;
    public hate_threatening!: boolean;
    public illicit!: boolean;
    public illicit_violent!: boolean;
    public self_harm!: boolean;
    public self_harm_intent!: boolean;
    public self_harm_instructions!: boolean;
    public violence!: boolean;
    public violence_graphic!: boolean;
    public sexual_score!: number;
    public sexual_minors_score!: number;
    public harassment_score!: number;
    public harassment_threatening_score!: number;
    public hate_score!: number;
    public hate_threatening_score!: number;
    public illicit_score!: number;
    public illicit_violent_score!: number;
    public self_harm_score!: number;
    public self_harm_intent_score!: number;
    public self_harm_instructions_score!: number;
    public violence_score!: number;
    public violence_graphic_score!: number;
    public balanced_score!: number;

    private static calculateBalancedScore(scores: Moderation): number {
        const values = Object.values(scores.category_scores);
        if (values.length === 0) return 0;
        const maxScore = Math.max(...values);
        const totalRisk = 1 - values.reduce((acc, score) => acc * (1 - score), 1);
        console.log(`max score = ${maxScore}, total risk = ${totalRisk}`)
        return (maxScore + totalRisk) / 2;
    }

    public static buildFromModeration(targetType: string, targetId: number, result: Moderation) {
        const instance = OpenAIModerationResult.build({
            // input: (data as any).input, // openai type omits input but we use it
            raw: result,
            flagged: result.flagged,
            targetType,
            targetId,

            // Category flags
            sexual: result.categories["sexual"],
            sexual_minors: result.categories["sexual/minors"],
            harassment: result.categories["harassment"],
            harassment_threatening: result.categories["harassment/threatening"],
            hate: result.categories["hate"],
            hate_threatening: result.categories["hate/threatening"],
            illicit: result.categories["illicit"],
            illicit_violent: result.categories["illicit/violent"],
            self_harm: result.categories["self-harm"],
            self_harm_intent: result.categories["self-harm/intent"],
            self_harm_instructions: result.categories["self-harm/instructions"],
            violence: result.categories["violence"],
            violence_graphic: result.categories["violence/graphic"],

            // Scores
            sexual_score: result.category_scores["sexual"],
            sexual_minors_score: result.category_scores["sexual/minors"],
            harassment_score: result.category_scores["harassment"],
            harassment_threatening_score: result.category_scores["harassment/threatening"],
            hate_score: result.category_scores["hate"],
            hate_threatening_score: result.category_scores["hate/threatening"],
            illicit_score: result.category_scores["illicit"],
            illicit_violent_score: result.category_scores["illicit/violent"],
            self_harm_score: result.category_scores["self-harm"],
            self_harm_intent_score: result.category_scores["self-harm/intent"],
            self_harm_instructions_score: result.category_scores["self-harm/instructions"],
            violence_score: result.category_scores["violence"],
            violence_graphic_score: result.category_scores["violence/graphic"],

            balanced_score: this.calculateBalancedScore(result),
        });

        return instance;
    }
  }
OpenAIModerationResult.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    commentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: false,
        references: {
            model: 'comments',
            key: 'id',
        },
    },
    targetType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    targetId: {
        type: DataTypes.NUMBER,
        allowNull: false,
    },
    raw: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    flagged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    // Category booleans
    sexual: DataTypes.BOOLEAN,
    sexual_minors: DataTypes.BOOLEAN,
    harassment: DataTypes.BOOLEAN,
    harassment_threatening: DataTypes.BOOLEAN,
    hate: DataTypes.BOOLEAN,
    hate_threatening: DataTypes.BOOLEAN,
    illicit: DataTypes.BOOLEAN,
    illicit_violent: DataTypes.BOOLEAN,
    self_harm: DataTypes.BOOLEAN,
    self_harm_intent: DataTypes.BOOLEAN,
    self_harm_instructions: DataTypes.BOOLEAN,
    violence: DataTypes.BOOLEAN,
    violence_graphic: DataTypes.BOOLEAN,

    // Category scores
    sexual_score: DataTypes.FLOAT,
    sexual_minors_score: DataTypes.FLOAT,
    harassment_score: DataTypes.FLOAT,
    harassment_threatening_score: DataTypes.FLOAT,
    hate_score: DataTypes.FLOAT,
    hate_threatening_score: DataTypes.FLOAT,
    illicit_score: DataTypes.FLOAT,
    illicit_violent_score: DataTypes.FLOAT,
    self_harm_score: DataTypes.FLOAT,
    self_harm_intent_score: DataTypes.FLOAT,
    self_harm_instructions_score: DataTypes.FLOAT,
    violence_score: DataTypes.FLOAT,
    violence_graphic_score: DataTypes.FLOAT,

    balanced_score: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: sequelize,
    modelName: 'OpenAIModerationResult',
});