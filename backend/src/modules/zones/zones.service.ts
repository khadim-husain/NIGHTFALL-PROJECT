import { prisma } from '../../config/prisma.js';

export class ZonesService {
  public async getZones() {
    return prisma.zone.findMany({
      where: { active: true },
      include: {
        kiosks: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }
}

export const zonesService = new ZonesService();

