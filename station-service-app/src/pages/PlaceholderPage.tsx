interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-secondary-900 mb-2">{title}</h2>
      <p className="text-secondary-500">
        {description || 'Cette page sera implementee prochainement.'}
      </p>
    </div>
  );
}
