function eligibleKode2(kode2) {
  return {
    OR: [
      { kode2: kode2 ?? '' },
      { kode2: '' },
      { kode2: null }
    ]
  };
}

class LisensiRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  findEligible(client, kode, kode2) {
    return client.lisensi.findFirst({
      where: { kode, ...eligibleKode2(kode2) },
      orderBy: { id: 'asc' }
    });
  }

  findByKode(client, kode) {
    return client.lisensi.findFirst({
      where: { kode },
      orderBy: { id: 'asc' }
    });
  }

  findById(client, id) {
    return client.lisensi.findUnique({ where: { id } });
  }

  list(client, { skip, take, search, sortField, sortOrder }) {
    const where = search
      ? {
          OR: [
            { kode: { contains: search } },
            { kode2: { contains: search } },
            { nama: { contains: search } },
            { modul: { contains: search } }
          ]
        }
      : {};

    return Promise.all([
      client.lisensi.findMany({
        where,
        skip,
        take,
        orderBy: [
          { [sortField]: sortOrder },
          { id: sortOrder }
        ]
      }),
      client.lisensi.count({ where })
    ]);
  }

  summary(client, now) {
    return Promise.all([
      client.lisensi.count(),
      client.lisensi.count({ where: { tglExpired: { gte: now } } }),
      client.lisensi.count({ where: { tglExpired: { lt: now } } })
    ]);
  }

  updateTestStatus(client, kode, kode2, versi, tglStatus) {
    return client.lisensi.updateMany({
      where: { kode, ...eligibleKode2(kode2) },
      data: { versi, tglStatus }
    });
  }

  updateName(client, kode, kode2, nama) {
    return client.lisensi.updateMany({
      where: { kode, ...eligibleKode2(kode2) },
      data: { nama }
    });
  }

  updateById(client, id, data) {
    return client.lisensi.update({
      where: { id },
      data
    });
  }

  create(client, data) {
    return client.lisensi.create({ data });
  }

  deleteById(client, id) {
    return client.lisensi.delete({ where: { id } });
  }

}

module.exports = LisensiRepository;
