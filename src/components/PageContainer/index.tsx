import type { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  description?: string;
  extra?: ReactNode;
  children: ReactNode;
}

//业务页面统一容器：负责标题、说明、右侧操作区和页面间距
export default function PageContainer({ title, description, extra, children }: PageContainerProps) {
  return (
    <section className="page-container">
      <header className="page-heading">
        <div>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {extra ? <div className="page-heading-actions">{extra}</div> : null}
      </header>
      <div className="page-body">{children}</div>
    </section>
  );
}
