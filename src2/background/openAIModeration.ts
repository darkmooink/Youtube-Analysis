import { Comment } from "../data/comments"
import { moderateText, moderateManySafe } from "../services/openAI/moderation"
import { OpenAIModerationResult as resultsdb } from "../data/openAIModerator"
import { FindOptions, Sequelize } from "sequelize";
import {sleep} from '../utils/async'
class openAIModeration{
    static async random(){
        const comment = await Comment.findOne({
            where: Sequelize.literal(`NOT EXISTS (
              SELECT 1 FROM "OpenAIModerationResults" m
              WHERE m."targetType" = 'comment' AND m."targetId" = "Comment"."id"
            )`),        
            order: Sequelize.literal("RANDOM()")
        });
        if (comment){
            const moderationResults = await moderateText(comment.originalText)
            resultsdb.buildFromModeration("comment", comment.id, moderationResults).save()
            console.log(moderationResults)
        }
    }
    static allCommentsRunning = false
    static async allComments(limit = 100, recheck = false) {
        while (openAIModeration.allCommentsRunning){
            await sleep(100)
        }
        this.allCommentsRunning = true
        const query:FindOptions<any> = {
            where: Sequelize.literal(`NOT EXISTS (
                SELECT 1 FROM "OpenAIModerationResults" m
                WHERE m."targetType" = 'comment' AND m."targetId" = "Comment"."id"
            )`),
            order: [["id", "DESC"]]
        }
        if(limit > 0){
            query.limit = limit
        }
        const comments = await Comment.findAll(query);
      
        const texts = comments.map(c => c.originalText);
        const results = await moderateManySafe(texts, 100);

        for (let i = 0; i < comments.length; i++) {
            const comment = comments[i];
            const result = results[i];
            if (result) {
                await resultsdb.buildFromModeration("comment", comment.id, result).save();
                console.log(`Moderated comment ${comment.id}`);
            }
        }
        this.allCommentsRunning = false
      }
}
export default openAIModeration