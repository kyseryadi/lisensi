CREATE TABLE `x_lisensi` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(255) NOT NULL,
    `kode2` VARCHAR(255) NULL,
    `nama` VARCHAR(255) NOT NULL,
    `versi` VARCHAR(100) NULL,
    `tgl_status` DATETIME(0) NULL,
    `tgl_expired` DATETIME(0) NOT NULL,
    `tgl_daftar` DATETIME(0) NOT NULL,
    `modul` TEXT NULL,

    INDEX `x_lisensi_kode_idx`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
