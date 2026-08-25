import MonacoEditor from '../MonacoEditor';

interface Props {
  body: string;
}

export default function RawLens({ body }: Props) {
  return <MonacoEditor value={body} onChange={() => {}} language="plaintext" height="100%" readOnly />;
}
