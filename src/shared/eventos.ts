/* Emisor de eventos mínimo (sin dependencias de Node, funciona en escritorio y navegador). */
type Oyente = (dato: any) => void;
export class Emisor {
  private oyentes = new Map<string, Set<Oyente>>();
  on(evento: string, fn: Oyente): () => void {
    if (!this.oyentes.has(evento)) this.oyentes.set(evento, new Set());
    this.oyentes.get(evento)!.add(fn);
    return () => this.oyentes.get(evento)?.delete(fn);
  }
  emit(evento: string, dato?: unknown): void { this.oyentes.get(evento)?.forEach(fn => fn(dato)); }
}
