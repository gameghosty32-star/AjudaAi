'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useApp, navigate } from '@/lib/store'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { Loader2, Save, X, Send } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

export function EditPostDialog({
  postId,
  open,
  onOpenChange,
  initial,
}: {
  postId: string
  open: boolean
  onOpenChange: (o: boolean) => void
  initial: { title: string; body: string | null; link: string | null; image: string | null; type: string }
}) {
  const [title, setTitle] = useState(initial.title)
  const [body, setBody] = useState(initial.body || '')
  const [link, setLink] = useState(initial.link || '')
  const [image, setImage] = useState<string | null>(initial.image || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(initial.title)
      setBody(initial.body || '')
      setLink(initial.link || '')
      setImage(initial.image || null)
    }
  }, [open, initial.title, initial.body, initial.link, initial.image])

  async function submit() {
    if (title.trim().length < 5) return toast.warning('Título muito curto.')
    setLoading(true)
    try {
      await api.patch(`/api/posts/${postId}`, {
        title,
        body: initial.type === 'link' ? body : body,
        link: initial.type === 'link' ? link : undefined,
        image: initial.type !== 'link' ? image : undefined,
      })
      toast.success('Publicação editada! ✏️')
      onOpenChange(false)
      // trigger refetch of the post detail
      window.dispatchEvent(new CustomEvent('post-edited', { detail: postId }))
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">✏️</span> Editar publicação
          </DialogTitle>
          <DialogDescription>Atualiza o título e o conteúdo da tua publicação.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto scroll-thin px-6 py-4">
          <div>
            <Label htmlFor="edit-title" className="mb-1.5 block">Título *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              maxLength={200}
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{title.length}/200</p>
          </div>

          {initial.type !== 'link' && (
            <div>
              <Label htmlFor="edit-body" className="mb-1.5 block">Conteúdo</Label>
              <Textarea
                id="edit-body"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 8000))}
                rows={8}
                className="resize-y"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{body.length}/8000</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                💡 Podes usar **negrito**, *itálico*, listas com "-" e parágrafos em branco.
              </p>
            </div>
          )}

          {initial.type !== 'link' && (
            <div>
              <Label className="mb-1.5 block">Imagem</Label>
              <ImageUpload value={image} onChange={setImage} />
            </div>
          )}

          {initial.type === 'link' && (
            <div>
              <Label htmlFor="edit-link" className="mb-1.5 block">URL</Label>
              <Input
                id="edit-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" disabled={loading} onClick={submit} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
