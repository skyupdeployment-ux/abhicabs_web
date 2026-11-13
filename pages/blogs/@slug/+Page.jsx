// pages/blogs/@slug/+Page.jsx
import { usePageContext } from "vike-react/usePageContext";
import BlogDetails from "../../../src/pages/BlogDetails";

export default function Page() {
  const pageContext = usePageContext();
  const slug = pageContext.routeParams?.slug;
  return <BlogDetails vikeSlug={slug} />;
}
