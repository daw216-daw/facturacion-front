import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Box,
  IconButton,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import TitleIcon from '@mui/icons-material/Title';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

export default function DocumentoTextoEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const btn = (active) => ({
    color: active ? 'primary' : 'default',
    size: 'small',
  });

  return (
    <Box>
      {/* TOOLBAR */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 0.5,
          mb: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <Tooltip title="Negrita">
          <IconButton
            {...btn(editor.isActive('bold'))}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Cursiva">
          <IconButton
            {...btn(editor.isActive('italic'))}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Tachado">
          <IconButton
            {...btn(editor.isActive('strike'))}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikethroughSIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {[1, 2, 3].map((level) => (
          <Tooltip key={level} title={`Título ${level}`}>
            <IconButton
              {...btn(editor.isActive('heading', { level }))}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
            >
              <TitleIcon fontSize="small" />
              <Box component="span" sx={{ fontSize: 12 }}>
                {level}
              </Box>
            </IconButton>
          </Tooltip>
        ))}

        <Divider orientation="vertical" flexItem />

        <Tooltip title="Lista con viñetas">
          <IconButton
            {...btn(editor.isActive('bulletList'))}
            onClick={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <FormatListBulletedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Lista numerada">
          <IconButton
            {...btn(editor.isActive('orderedList'))}
            onClick={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
          >
            <FormatListNumberedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* EDITOR */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 2,
          minHeight: 180,
          backgroundColor: 'background.paper',
          '& h1': { fontSize: '1.6rem' },
          '& h2': { fontSize: '1.3rem' },
          '& h3': { fontSize: '1.1rem' },
          '& ul, & ol': { pl: 3 },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
