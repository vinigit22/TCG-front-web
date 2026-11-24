import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatusTorneio } from '../core/models/api';
import { ROTULOS_STATUS_TORNEIO } from '../core/rotulos';
import { TOM_STATUS_TORNEIO } from './formatar';

// Selo do status do torneio (o "em andamento" pisca, como ao vivo)
@Component({
  selector: 'app-selo-torneio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="selo"
    [class]="classe()"
    [class.selo-vivo]="status() === 'EM_ANDAMENTO'"
    >{{ rotulo() }}</span
  >`,
})
export class SeloTorneio {
  readonly status = input.required<StatusTorneio>();

  protected readonly classe = computed(() => 'selo-' + TOM_STATUS_TORNEIO[this.status()]);
  protected readonly rotulo = computed(() => ROTULOS_STATUS_TORNEIO[this.status()]);
}
