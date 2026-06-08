import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CalloutTone = "note" | "warning" | "success";

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside data-component="callout" data-tone={tone}>
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </aside>
  );
}

export function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <figure data-component="metric">
      <figcaption>{label}</figcaption>
      <strong>{value}</strong>
      {caption && <p>{caption}</p>}
    </figure>
  );
}

export function Link(props: ComponentPropsWithoutRef<"a">) {
  return (
    <a
      {...props}
      rel={props.href?.startsWith("http") ? "noreferrer" : props.rel}
    />
  );
}

export const mdxComponents = {
  a: Link,
  Callout,
  Metric,
};
