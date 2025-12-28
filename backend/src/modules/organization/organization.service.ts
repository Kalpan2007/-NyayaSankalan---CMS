import { prisma } from '../../prisma/client';

export class OrganizationService {
  /**
   * List all police stations
   */
  async getPoliceStations() {
    const stations = await prisma.policeStation.findMany({
      select: {
        id: true,
        name: true,
        district: true,
        state: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return stations;
  }

  /**
   * List all courts
   */
  async getCourts() {
    const courts = await prisma.court.findMany({
      select: {
        id: true,
        name: true,
        courtType: true,
        district: true,
        state: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return courts;
  }
}
