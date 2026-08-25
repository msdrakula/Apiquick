import MonacoEditor from '../MonacoEditor';

interface Props {
  body: string;
}

export default function XMLLens({ body }: Props) {
  return <MonacoEditor value={body} onChange={() => {}} language="xml" height="100%" readOnly />;
}
