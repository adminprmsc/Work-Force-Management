import { Inject, Injectable } from '@nestjs/common';
import {
  OFFICE_REPOSITORY,
  OfficeRepositoryPort,
} from '../../ports/office.repository.port';
import { OfficeType } from '../../../domain/entities/user.entity';

@Injectable()
export class ListOfficesUseCase {
  constructor(
    @Inject(OFFICE_REPOSITORY)
    private readonly officeRepository: OfficeRepositoryPort,
  ) {}

  execute(filter?: { type?: OfficeType }) {
    return this.officeRepository.findAll(filter);
  }
}
