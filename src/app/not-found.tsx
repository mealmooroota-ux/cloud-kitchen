import { Shell } from "@/components/site/Shell";
import { Empty, LinkButton } from "@/components/ui";
export default function NotFound() {
  return <Shell><div className="mx-auto max-w-[720px] px-4 py-20"><Empty title="This page isn’t on the menu" body="The link may be old, or the dish was removed." action={<LinkButton href="/menu">See the menu</LinkButton>} /></div></Shell>;
}
