import SectionForm from "./SectionForm";

export default function SectionKeyPage({ sectionKey, title }) {
  return (
    <SectionForm fixedKey={sectionKey} fixedTitle={title} cancelPath="/" />
  );
}
