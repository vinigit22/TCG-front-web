import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento } from '../../core/models/api';
import { ROTULOS_STATUS_EVENTO, ROTULOS_TIPO_EVENTO } from '../../core/rotulos';
import { EventoService } from '../../core/services/evento.service';
import { EstadoVazio } from '../../ui/estado-vazio';
import { TOM_STATUS_EVENTO } from '../../ui/formatar';
import { Icone } from '../../ui/icone';
import { recurso } from '../../ui/recurso';
import { idDaLojaLogada } from '../loja-atual';
import { eventoFuturo, ICONE_TIPO_EVENTO } from './evento-util';

type Filtro = 'proximos' | 'rascunhos' | 'passados' | 'todos';

@Component({
  selector: 'app-lista-eventos',
  imports: [RouterLink, DatePipe, Icone, EstadoVazio],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lista-eventos.html',
  styleUrl: './lista-eventos.css',
})
export class ListaEventos {
  private readonly lojaId = idDaLojaLogada();
  private readonly servico = inject(EventoService);
  protected readonly eventos = recurso(() => this.servico.listar({ lojaId: this.lojaId }));

  protected readonly filtro = signal<Filtro>('proximos');
  protected readonly rotuloTipo = ROTULOS_TIPO_EVENTO;
  protected readonly rotuloStatus = ROTULOS_STATUS_EVENTO;
  protected readonly tomStatus = TOM_STATUS_EVENTO;
  protected readonly iconeTipo = ICONE_TIPO_EVENTO;

  private readonly grupos = computed(() => {
    const lista = this.eventos.dados() ?? [];
    const ativo = (evento: Evento) => evento.status !== 'RASCUNHO' && evento.status !== 'CANCELADO';
    return {
      proximos: lista.filter(
        (evento) => ativo(evento) && evento.status !== 'ENCERRADO' && eventoFuturo(evento),
      ),
      rascunhos: lista.filter((evento) => evento.status === 'RASCUNHO'),
      passados: lista.filter(
        (evento) =>
          evento.status === 'CANCELADO' ||
          evento.status === 'ENCERRADO' ||
          (ativo(evento) && !eventoFuturo(evento)),
      ),
      todos: lista,
    };
  });

  protected readonly filtros: { id: Filtro; rotulo: string }[] = [
    { id: 'proximos', rotulo: 'Próximos' },
    { id: 'rascunhos', rotulo: 'Rascunhos' },
    { id: 'passados', rotulo: 'Encerrados e cancelados' },
    { id: 'todos', rotulo: 'Todos' },
  ];

  protected readonly contagem = computed(() => {
    const grupos = this.grupos();
    return {
      proximos: grupos.proximos.length,
      rascunhos: grupos.rascunhos.length,
      passados: grupos.passados.length,
      todos: grupos.todos.length,
    };
  });

  protected readonly visiveis = computed(() => {
    const lista = [...this.grupos()[this.filtro()]];
    // Próximos: o mais perto primeiro; o resto: o mais recente primeiro
    return this.filtro() === 'proximos'
      ? lista.sort((a, b) => a.dataInicio.localeCompare(b.dataInicio))
      : lista.sort((a, b) => b.dataInicio.localeCompare(a.dataInicio));
  });
}
