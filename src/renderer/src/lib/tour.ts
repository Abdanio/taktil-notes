import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export function startOnboardingTour(onComplete: () => void): void {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    popoverClass: 'driverjs-theme',
    nextBtnText: 'Lanjut →',
    prevBtnText: '← Kembali',
    doneBtnText: 'Mulai Menulis',
    progressText: '{{current}} dari {{total}}',
    onDestroyStarted: () => {
      onComplete()
      driverObj.destroy()
    },
    steps: [
      {
        element: '#editor-container',
        popover: {
          title: 'Kanvas Bebas Distraksi & Auto-Save',
          description:
            'Tulis pemikiran Anda dengan bebas dalam format Markdown. Setiap ketikan otomatis tersimpan ke penyimpanan lokal setelah jeda 300ms tanpa perlu menekan tombol simpan.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#note-list-container',
        popover: {
          title: 'Atur dengan Drag & Drop Taktil',
          description:
            'Tarik kartu catatan ke atas/bawah untuk mengubah urutan, atau geser kartu langsung ke folder di kolom samping kiri dengan umpan balik magnetik yang halus.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#editor-drop-area',
        popover: {
          title: 'Tarik File dari Komputer',
          description:
            'Jatuhkan file gambar (.png, .jpg, .webp) atau berkas teks (.md, .txt) dari komputer langsung ke kanvas ini untuk menyematkannya secara otomatis ke aset lokal.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#always-on-top-button',
        popover: {
          title: 'Mode Melayang (Always on Top)',
          description:
            'Aktifkan mode melayang agar jendela catatan selalu berada di atas aplikasi lain saat Anda mengetik referensi, riset, atau membaca dokumen.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '#sidebar-container',
        popover: {
          title: 'Navigasi Cepat Keyboard',
          description:
            'Gunakan Ctrl + K untuk membuka palet perintah instan, Ctrl + N untuk catatan baru, atau tekan Ctrl + / kapan saja untuk membuka contekan pintasan keyboard.',
          side: 'right',
          align: 'end'
        }
      }
    ]
  })

  // Small delay to ensure all DOM nodes are mounted
  setTimeout(() => {
    driverObj.drive()
  }, 200)
}
