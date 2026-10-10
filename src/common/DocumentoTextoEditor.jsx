import { useEffect } from 'react';
import { useEditor, useEditorState, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Box,
  IconButton,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

/**
 * Editor de texto enriquecido (TipTap) con barra de herramientas MUI.
 * value: HTML · onChange(html)
 * placeholder: texto de ayuda cuando está vacío · minHeight: alto mínimo · error: borde rojo
 */
export default function DocumentoTextoEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí…',
  minHeight = 180,
  error = false,
}) {
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

  // TipTap v3 no repinta el componente en cada cambio: nos suscribimos
  // solo a lo que necesita la barra (botones activos, vacío, deshacer)
  const estado = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      bold: ed?.isActive('bold') ?? false,
      italic: ed?.isActive('italic') ?? false,
      strike: ed?.isActive('strike') ?? false,
      h1: ed?.isActive('heading', { level: 1 }) ?? false,
      h2: ed?.isActive('heading', { level: 2 }) ?? false,
      h3: ed?.isActive('heading', { level: 3 }) ?? false,
      bulletList: ed?.isActive('bulletList') ?? false,
      orderedList: ed?.isActive('orderedList') ?? false,
      isEmpty: ed?.isEmpty ?? true,
      canUndo: ed?.can().undo() ?? false,
      canRedo: ed?.can().redo() ?? false,
    }),
  });

  // El contenido inicial solo se aplica al crear el editor: si el valor llega
  // después (p. ej. al cargar un presupuesto para editar), se sincroniza aquí
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    // '' y '<p></p>' son lo mismo: no hay nada que sincronizar
    if (!value && editor.isEmpty) return;
    const actual = editor.getHTML();
    if ((value ?? '') !== actual && !editor.isFocused) {
      editor.commands.setContent(value ?? '', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const run = (fn) => () => fn(editor.chain().focus()).run();

  const botones = [
    [
      { key: 'bold', title: 'Negrita (Ctrl+B)', icon: <FormatBoldIcon fontSize="small" />, action: run((c) => c.toggleBold()) },
      { key: 'italic', title: 'Cursiva (Ctrl+I)', icon: <FormatItalicIcon fontSize="small" />, action: run((c) => c.toggleItalic()) },
      { key: 'strike', title: 'Tachado', icon: <StrikethroughSIcon fontSize="small" />, action: run((c) => c.toggleStrike()) },
    ],
    [1, 2, 3].map((level) => ({
      key: `h${level}`,
      title: `Título ${level}`,
      icon: (
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, width: 20 }}>
          H{level}
        </Typography>
      ),
      action: run((c) => c.toggleHeading({ level })),
    })),
    [
      { key: 'bulletList', title: 'Lista con viñetas', icon: <FormatListBulletedIcon fontSize="small" />, action: run((c) => c.toggleBulletList()) },
      { key: 'orderedList', title: 'Lista numerada', icon: <FormatListNumberedIcon fontSize="small" />, action: run((c) => c.toggleOrderedList()) },
    ],
  ];

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        overflow: 'hidden',
        transition: 'border-color .15s, box-shadow .15s',
        '&:hover': { borderColor: error ? 'error.main' : 'text.primary' },
        // Foco en todo el recuadro (como un TextField), no en la línea interna
        '&:focus-within': {
          borderColor: error ? 'error.main' : 'primary.main',
          boxShadow: (t) => `0 0 0 1px ${error ? t.palette.error.main : t.palette.primary.main}`,
        },
      }}
    >
      {/* BARRA DE HERRAMIENTAS */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.25}
        useFlexGap
        flexWrap="wrap"
        sx={{
          px: 0.5,
          py: 0.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        {botones.map((grupo, i) => (
          <Stack key={i} direction="row" alignItems="center" spacing={0.25}>
            {i > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />}
            {grupo.map((b) => (
              <Tooltip key={b.key} title={b.title}>
                <IconButton
                  size="small"
                  onClick={b.action}
                  // Evita que el botón robe el foco y se pierda la selección
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{
                    borderRadius: 1,
                    color: estado[b.key] ? 'primary.main' : 'text.secondary',
                    bgcolor: estado[b.key] ? 'action.selected' : 'transparent',
                    outline: 'none !important',
                  }}
                >
                  {b.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        ))}

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Deshacer (Ctrl+Z)">
          <span>
            <IconButton
              size="small"
              onClick={run((c) => c.undo())}
              onMouseDown={(e) => e.preventDefault()}
              disabled={!estado.canUndo}
              sx={{ borderRadius: 1, outline: 'none !important' }}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Rehacer (Ctrl+Y)">
          <span>
            <IconButton
              size="small"
              onClick={run((c) => c.redo())}
              onMouseDown={(e) => e.preventDefault()}
              disabled={!estado.canRedo}
              sx={{ borderRadius: 1, outline: 'none !important' }}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* ÁREA DE ESCRITURA */}
      <Box
        // Clic en cualquier zona vacía del recuadro → foco al final del texto
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            editor.chain().focus('end').run();
          }
        }}
        sx={{
          position: 'relative',
          cursor: 'text',
          px: 2,
          py: 1.5,
          minHeight,
          // El área editable de TipTap ocupa todo el recuadro y sin el borde negro del navegador
          '& .ProseMirror': {
            outline: 'none',
            minHeight: minHeight - 24,
            lineHeight: 1.6,
          },
          '& .ProseMirror p': { m: 0, mb: 1 },
          '& .ProseMirror h1': { fontSize: '1.6rem', m: 0, mb: 1 },
          '& .ProseMirror h2': { fontSize: '1.3rem', m: 0, mb: 1 },
          '& .ProseMirror h3': { fontSize: '1.1rem', m: 0, mb: 1 },
          '& .ProseMirror ul, & .ProseMirror ol': { pl: 3, m: 0, mb: 1 },
        }}
      >
        {estado.isEmpty && (
          <Typography
            aria-hidden
            sx={{
              position: 'absolute',
              top: 12,
              left: 16,
              color: 'text.disabled',
              pointerEvents: 'none',
              lineHeight: 1.6,
            }}
          >
            {placeholder}
          </Typography>
        )}

        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
