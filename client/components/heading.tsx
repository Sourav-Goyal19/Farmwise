interface HeadingProps {
  title: string;
  subheading?: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, subheading }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground">{subheading}</p>
    </div>
  );
};
