/**
 * Parse page range string like "1-5, 12, 20-25" into array of page numbers
 */
export function parsePageRanges(rangeString: string): number[] {
  const pages = new Set<number>();
  const parts = rangeString.split(',').map(p => p.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      }
    } else {
      const num = parseInt(part);
      if (!isNaN(num)) {
        pages.add(num);
      }
    }
  }
  
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Detect if two images have significant differences
 * Returns difference percentage (0-100)
 */
export async function detectImageDifference(
  imageData1: string, 
  imageData2: string,
  threshold: number = 5
): Promise<{ isDifferent: boolean; diffPercentage: number }> {
  return new Promise((resolve) => {
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d')!;
    const ctx2 = canvas2.getContext('2d')!;
    
    const img1 = new Image();
    const img2 = new Image();
    
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded === 2) {
        const w = Math.min(img1.width, img2.width);
        const h = Math.min(img1.height, img2.height);
        
        canvas1.width = canvas2.width = w;
        canvas1.height = canvas2.height = h;
        
        ctx1.drawImage(img1, 0, 0, w, h);
        ctx2.drawImage(img2, 0, 0, w, h);
        
        const data1 = ctx1.getImageData(0, 0, w, h).data;
        const data2 = ctx2.getImageData(0, 0, w, h).data;
        
        let diff = 0;
        const sampleRate = 10; // Check every 10th pixel for speed
        
        for (let i = 0; i < data1.length; i += 4 * sampleRate) {
          const r = Math.abs(data1[i] - data2[i]);
          const g = Math.abs(data1[i + 1] - data2[i + 1]);
          const b = Math.abs(data1[i + 2] - data2[i + 2]);
          if (r + g + b > 30) diff++;
        }
        
        const total = data1.length / (4 * sampleRate);
        const diffPercentage = (diff / total) * 100;
        
        resolve({
          isDifferent: diffPercentage > threshold,
          diffPercentage: Math.round(diffPercentage * 100) / 100
        });
      }
    };
    
    img1.onload = checkLoaded;
    img2.onload = checkLoaded;
    img1.src = imageData1;
    img2.src = imageData2;
  });
}
