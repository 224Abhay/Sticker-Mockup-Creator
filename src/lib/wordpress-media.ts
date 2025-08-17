export interface WordPressMediaResponse {
  id: number;
  source_url: string;
  alt_text: string;
  title: {
    rendered: string;
  };
  media_details: {
    sizes: {
      [key: string]: {
        source_url: string;
        width: number;
        height: number;
      };
    };
  };
}

export class WordPressMediaService {
  private siteUrl: string;
  private username: string;
  private password: string;

  constructor(siteUrl: string, username: string, password: string) {
    this.siteUrl = siteUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
  }

  async uploadMedia(file: File): Promise<WordPressMediaResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Use WordPress username/password authentication
    const auth = btoa(`${this.username}:${this.password}`);
    
    const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }

  async getMedia(mediaId: number): Promise<WordPressMediaResponse> {
    const auth = btoa(`${this.username}:${this.password}`);

    const response = await fetch(`${this.siteUrl}/wp-json/wp/v2/media/${mediaId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  }
}
