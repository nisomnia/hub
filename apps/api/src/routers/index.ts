import { adRouter } from "./ad"
import { articleRouter } from "./article"
import { articleCommentRouter } from "./article-comment"
import { feedRouter } from "./feed"
import { genreRouter } from "./genre"
import { mediaRouter } from "./media"
import { movieRouter } from "./movie"
import { productionCompanyRouter } from "./production-company"
import { topicRouter } from "./topic"
import { userRouter } from "./user"

export const router = {
  ...adRouter,
  ...articleCommentRouter,
  ...articleRouter,
  ...feedRouter,
  ...genreRouter,
  ...mediaRouter,
  ...movieRouter,
  ...productionCompanyRouter,
  ...topicRouter,
  ...userRouter,
}
