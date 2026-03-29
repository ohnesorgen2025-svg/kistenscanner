import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  kicker?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, kicker, actions }: PageHeaderProps) {
  return (
    <section className="panel page-header-card">
      <div className="page-header">
        <div className="page-header__copy">
          {kicker ? <p className="section-kicker">{kicker}</p> : null}
          <h1>{title}</h1>
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
    </section>
  );
}
