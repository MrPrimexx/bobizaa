import cheerio from 'cheerio';
import fetch from 'node-fetch';

const getList = async () => {
  try {
    const response = await fetch('https://books-library.net/sitemap');
    const html = await response.text();
    const $ = cheerio.load(html);

    const downloadRegex = /\/[^/]*-download$/;

    const books = $('li').map((index, element) => {
      const link = $(element).find('h4 a').attr('href');
      const title = $(element).find('h4 a').text();
      const description = $(element).find('h6 small.muted').text().trim();
      if (downloadRegex.test(link)) {
        return { index: index + 1, title, link, description };
      }
    }).get();

    return books.filter(book => book); // Filter out undefined items
  } catch (error) {
    console.error('Error fetching book list:', error);
    return [];
  }
};

const getCategory = async (bookLink) => {
  try {
    const response = await fetch(`https://books-library.net${bookLink}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const categories = $('.col-xl-3 .smlbooks.book a.oneBook').map((index, element) => {
      const link = 'https://books-library.net/' + $(element).attr('href');
      const title = $(element).attr('title');
      return { index: index + 1, title, link };
    }).get();

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

const getDownloadLinks = async (categoryLink) => {
  try {
    const response = await fetch(categoryLink);
    const html = await response.text();
    const $ = cheerio.load(html);

    const downloadLinks = $('.col-12.col-sm-12.col-md-6 a[href*="books-library.net/files"]').map((index, element) => {
      return $(element).attr('href');
    }).get();

    return downloadLinks;
  } catch (error) {
    console.error('Error fetching download links:', error);
    return [];
  }
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const query = text.trim();
  if (!query) {
    const books = await getList();
    const message = books.map(book => `*${book.index}.* ${book.title} - ${book.description}`).join('\n');
    await m.reply(message);
  } else {
    const parts = query.split(' ');
    const bookIndex = parseInt(parts[0]);
    const books = await getList();

    if (bookIndex >= 1 && bookIndex <= books.length) {
      const book = books[bookIndex - 1];
      const categories = await getCategory(book.link);

      if (parts.length > 1) {
        const categoryIndex = parseInt(parts[1]);
        
        if (categoryIndex >= 1 && categoryIndex <= categories.length) {
          const category = categories[categoryIndex - 1];
          const downloadLinks = await getDownloadLinks(category.link);
          const message = downloadLinks.map((link, index) => `*${index + 1}.* ${link}`).join('\n');
          await m.reply(message);
        } else {
          await m.reply('Invalid category index.');
        }
      } else {
        const message = categories.map(category => `*${category.index}.* ${category.title}`).join('\n');
        await m.reply(message);
      }
    } else {
      await m.reply('Invalid book index.');
    }
  }
};

handler.help = ["bookslib"];
handler.tags = ["pdf"];
handler.command = /^(bookslib)$/i;

export default handler;
