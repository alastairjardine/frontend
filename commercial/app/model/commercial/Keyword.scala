package model.commercial

import scala.concurrent.Future
import conf.SwitchingContentApi
import common.{Logging, ExecutionContexts}
import contentapi.ContentApiClient

case class Keyword(id: String, webTitle: String) {

  /* has to do same transformation as getKeywords in
   * common/app/assets/javascripts/modules/adverts/document-write.js
   * so that it can be used for matching
   */
  val name = webTitle.toLowerCase.replaceAll( """\s""", "-")

}

object Keyword extends ExecutionContexts with Logging {

  def lookup(term: String, section: Option[String] = None): Future[Seq[Keyword]] = {
    val baseQuery = SwitchingContentApi().tags.q(term).tagType("keyword").pageSize(50)
    val query = section.foldLeft(baseQuery)((acc, sectionName) => acc section sectionName)

    val result = query.response.map {
      _.results.map(tag => Keyword(tag.id, tag.webTitle))
    } recover {
      case e =>
        log.warn(s"Failed to look up [$term]: ${e.getMessage}")
        Nil
    }

    result onSuccess {
      case keywords => log.info(s"Looking up [$term] gave ${keywords.map(_.id)}")
    }

    result
  }
}
