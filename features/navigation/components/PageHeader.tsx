type PageHeaderProps = { title: string; description: string };

const PageHeader = ({ title, description }: PageHeaderProps) => (
  <header className="mb-5">
    <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
    <p className="mt-1 text-sm text-zinc-600">{description}</p>
  </header>
);

export default PageHeader;
