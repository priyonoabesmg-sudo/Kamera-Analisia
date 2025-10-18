document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const title1Input = document.getElementById('title1') as HTMLInputElement;
  const title2Input = document.getElementById('title2') as HTMLInputElement;
  const title3Input = document.getElementById('title3') as HTMLInputElement;
  const yearSelect = document.getElementById('year-select') as HTMLSelectElement;
  const bgImageInput = document.getElementById('bg-image-input') as HTMLInputElement;
  const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
  const opacityValueSpan = document.getElementById('opacity-value') as HTMLSpanElement;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
  const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
  const canvas = document.getElementById('calendar-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  // Constants
  const PASARAN_JAWA = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi']; // Adjusted for calculation
  const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Reference date: 5 April 1977 is Selasa Kliwon
  const REF_DATE = new Date(1977, 3, 5); // April is month 3
  const REF_PASARAN_INDEX = 3; // Kliwon

  let backgroundImage: HTMLImageElement | null = null;
  
  // --- Initialization ---
  function populateYearSelect() {
    const currentYear = new Date().getFullYear();
    for (let year = 1600; year <= 2100; year++) {
      const option = document.createElement('option');
      option.value = year.toString();
      option.textContent = year.toString();
      if (year === currentYear) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    }
  }

  // --- Core Logic ---
  function getPasaran(date: Date): string {
    const timeDiff = date.getTime() - REF_DATE.getTime();
    const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));
    const pasaranIndex = (REF_PASARAN_INDEX + dayDiff % 5 + 5) % 5;
    return PASARAN_JAWA[pasaranIndex];
  }

  function generateCalendarData(year: number) {
    const calendarData = [];
    for (let month = 0; month < 12; month++) {
      const monthData = {
        name: NAMA_BULAN[month],
        weeks: [] as { day: number; pasaran: string; isSunday: boolean }[][]
      };
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfMonth = new Date(year, month, 1).getDay();

      let currentWeek: { day: number; pasaran: string; isSunday: boolean }[] = [];
      
      // Add empty cells for days before the 1st
      for (let i = 0; i < firstDayOfMonth; i++) {
        currentWeek.push(null!);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        if (currentWeek.length === 7) {
          monthData.weeks.push(currentWeek);
          currentWeek = [];
        }
        currentWeek.push({
          day: day,
          pasaran: getPasaran(currentDate),
          isSunday: currentDate.getDay() === 0,
        });
      }

      // Add empty cells to complete the last week
      while (currentWeek.length < 7) {
        currentWeek.push(null!);
      }
      monthData.weeks.push(currentWeek);
      
      calendarData.push(monthData);
    }
    return calendarData;
  }

  // --- Canvas Drawing ---
  function drawCalendar() {
    const year = parseInt(yearSelect.value, 10);
    const titles = [title1Input.value, title2Input.value, title3Input.value];
    const opacity = parseInt(opacitySlider.value, 10) / 100;
    const calendarData = generateCalendarData(year);

    // Setup canvas dimensions
    canvas.width = 1800;
    canvas.height = 2400;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
    }
    
    // --- Draw Titles and Year ---
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';

    let titleY = 120;
    ctx.font = 'bold 60px "Orbitron", sans-serif';
    titles.forEach(title => {
        if (title) {
            ctx.fillText(title.toUpperCase(), canvas.width / 2, titleY);
            titleY += 70;
        }
    });

    ctx.font = 'bold 72px "Orbitron", sans-serif';
    ctx.fillText(year.toString(), canvas.width / 2, titleY + 30);
    
    // --- Draw Calendar Grid ---
    const gridCols = 3;
    const gridRows = 4;
    const monthWidth = canvas.width / gridCols;
    const monthHeight = (canvas.height - (titleY + 100)) / gridRows;
    const startY = titleY + 100;

    calendarData.forEach((month, index) => {
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        const monthX = col * monthWidth;
        const monthY = startY + row * monthHeight;

        // Draw Month Name
        ctx.font = 'bold 36px "Roboto", sans-serif';
        ctx.fillStyle = 'black';
        ctx.fillText(month.name, monthX + monthWidth / 2, monthY + 50);

        // Draw Day Headers
        ctx.font = 'bold 24px "Roboto", sans-serif';
        const dayHeaderY = monthY + 90;
        for (let i = 0; i < NAMA_HARI.length; i++) {
          ctx.fillStyle = i === 0 ? 'red' : 'black';
          ctx.fillText(NAMA_HARI[i], monthX + (i + 0.5) * (monthWidth / 7), dayHeaderY);
        }

        // Draw Dates and Pasaran
        const dateStartY = dayHeaderY + 20;
        const cellHeight = (monthHeight - 110) / month.weeks.length;
        month.weeks.forEach((week, weekIndex) => {
            const weekY = dateStartY + (weekIndex + 0.5) * cellHeight;
            week.forEach((day, dayIndex) => {
                if (!day) return;
                
                const dayX = monthX + (dayIndex + 0.5) * (monthWidth / 7);

                // Draw Date Number
                ctx.font = 'bold 28px "Roboto", sans-serif';
                ctx.fillStyle = day.isSunday ? 'red' : 'black';
                ctx.fillText(day.day.toString(), dayX, weekY - 5);

                // Draw Pasaran
                ctx.font = '18px "Roboto", sans-serif';
                ctx.fillStyle = '#555';
                ctx.fillText(day.pasaran, dayX, weekY + 20);
            });
        });
    });

    downloadBtn.classList.remove('hidden');
  }


  // --- Event Listeners ---
  bgImageInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          backgroundImage = img;
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  });

  opacitySlider.addEventListener('input', () => {
    opacityValueSpan.textContent = opacitySlider.value;
  });

  generateBtn.addEventListener('click', drawCalendar);

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `kalender-${yearSelect.value}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // --- Initial Call ---
  populateYearSelect();
});
