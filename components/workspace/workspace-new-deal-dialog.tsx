"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface WorkspaceNewDealDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>
  isPending: boolean
}

export function WorkspaceNewDealDialog({ open, onOpenChange, onSubmit, isPending }: WorkspaceNewDealDialogProps) {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setError(null)

    const result = await onSubmit(formData)

    if (result.success) {
      form.reset()
      onOpenChange(false)
    } else if (result.error) {
      setError(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Crear Nuevo Negocio</DialogTitle>
          <DialogDescription>Agrega un nuevo negocio a tu pipeline</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Negocio</Label>
            <Input id="title" name="title" placeholder="Plan Empresarial - Acme Corp" required disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" name="company" placeholder="Acme Corp" required disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor del Negocio (S/)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              placeholder="50000"
              required
              disabled={isPending}
              min="0"
              step="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Select name="stage" defaultValue="lead" disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead">Prospecto</SelectItem>
                <SelectItem value="qualified">Calificado</SelectItem>
                <SelectItem value="proposal">Propuesta</SelectItem>
                <SelectItem value="negotiation">Negociación</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Persona de Contacto</Label>
            <Input id="contact" name="contact" placeholder="Juan Pérez" required disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeDate">Fecha de Cierre Esperada</Label>
            <Input id="closeDate" name="closeDate" type="date" required disabled={isPending} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Negocio"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
