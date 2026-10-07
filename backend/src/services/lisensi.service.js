const { formatDateTime, startOfToday } = require('../utils/date');

function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function serializeLisensi(lisensi) {
  return {
    id: lisensi.id.toString(),
    kode: lisensi.kode,
    kode2: lisensi.kode2 ?? '',
    nama: lisensi.nama,
    versi: lisensi.versi ?? '',
    tgl_status: formatDateTime(lisensi.tglStatus),
    tgl_expired: formatDateTime(lisensi.tglExpired),
    tgl_daftar: formatDateTime(lisensi.tglDaftar),
    modul: lisensi.modul ?? ''
  };
}

class LisensiService {
  constructor(repository) {
    this.repository = repository;
  }

  async testLisensi({ kode, kode2, versi }) {
    const client = this.repository.prisma;
    await this.repository.updateTestStatus(client, kode, kode2, versi, new Date());

    const lisensi =
      await this.repository.findEligible(client, kode, kode2) ||
      await this.repository.findByKode(client, kode);

    if (!lisensi) {
      return {
        nama: 'Unknown',
        tgl_expired: '',
        status: '0',
        tgl_daftar: '',
        modul: ''
      };
    }

    return {
      status: new Date() > lisensi.tglExpired ? '50' : '20',
      nama: lisensi.nama,
      tgl_expired: formatDateTime(lisensi.tglExpired),
      tgl_daftar: formatDateTime(lisensi.tglDaftar, false),
      modul: lisensi.modul ?? ''
    };
  }

  async postLisensi({ kode, kode2, nama }) {
    const client = this.repository.prisma;
    const existing = await this.repository.findEligible(client, kode, kode2);

    if (existing) {
      await this.repository.updateName(client, kode, kode2, nama);
      return {
        status: '20',
        nama,
        tgl_expired: formatDateTime(existing.tglExpired)
      };
    }

    const created = await this.repository.create(client, {
      kode,
      kode2: kode2 ?? null,
      nama,
      tglExpired: startOfToday(),
      tglDaftar: new Date()
    });

    return {
      status: '0',
      nama: created.nama,
      tgl_expired: formatDateTime(created.tglExpired)
    };
  }

  async updateLisensi(id, { nama, tgl, modul }) {
    const client = this.repository.prisma;
    const lisensiId = BigInt(id);
    const existing = await this.repository.findById(client, lisensiId);

    if (!existing) return null;

    const [year, month, day] = tgl.split('-').map(Number);
    const tglExpired = new Date(year, month - 1, day, 0, 0, 0, 0);
    const updated = await this.repository.updateById(client, lisensiId, {
      nama,
      modul: modul || null,
      tglExpired
    });

    return {
      id: updated.id.toString(),
      nama: updated.nama,
      tgl_expired: formatDateTime(updated.tglExpired),
      modul: updated.modul ?? ''
    };
  }

  async listLisensi({ page, limit, search, sort_by: sortBy, sort_order: sortOrder }) {
    const sortField = sortBy === 'tgl_status' || sortBy === 'tanggal_aktivitas'
      ? 'tglStatus'
      : 'tglDaftar';

    const [items, total] = await this.repository.list(this.repository.prisma, {
      skip: (page - 1) * limit,
      take: limit,
      search,
      sortField,
      sortOrder
    });

    return {
      items: items.map(serializeLisensi),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async summaryLisensi() {
    const [totalLisensi, statusAktif, statusExpired] =
      await this.repository.summary(this.repository.prisma, new Date());

    return {
      total_lisensi: totalLisensi,
      status_aktif: statusAktif,
      status_expired: statusExpired
    };
  }

  async getLisensi(id) {
    const lisensi = await this.repository.findById(this.repository.prisma, BigInt(id));
    return lisensi ? serializeLisensi(lisensi) : null;
  }

  async createManagedLisensi(data) {
    const created = await this.repository.create(this.repository.prisma, {
      kode: data.kode,
      kode2: data.kode2 || null,
      nama: data.nama,
      versi: data.versi || null,
      tglExpired: parseDate(data.tgl_expired),
      tglDaftar: new Date(),
      modul: data.modul || null
    });

    return serializeLisensi(created);
  }

  async updateManagedLisensi(id, data) {
    const lisensiId = BigInt(id);
    const existing = await this.repository.findById(this.repository.prisma, lisensiId);
    if (!existing) return null;

    const updateData = {};
    if (data.kode !== undefined) updateData.kode = data.kode;
    if (data.kode2 !== undefined) updateData.kode2 = data.kode2 || null;
    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.versi !== undefined) updateData.versi = data.versi || null;
    if (data.tgl_expired !== undefined) updateData.tglExpired = parseDate(data.tgl_expired);
    if (data.modul !== undefined) updateData.modul = data.modul || null;

    const updated = await this.repository.updateById(this.repository.prisma, lisensiId, updateData);
    return serializeLisensi(updated);
  }

  async deleteLisensi(id) {
    const lisensiId = BigInt(id);
    const existing = await this.repository.findById(this.repository.prisma, lisensiId);
    if (!existing) return false;

    await this.repository.deleteById(this.repository.prisma, lisensiId);
    return true;
  }
}

module.exports = LisensiService;
