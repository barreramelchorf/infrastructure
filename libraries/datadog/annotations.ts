export interface DatadogAnnotationsInterface {
  [key: string]: any[];
}

export class DatadogAnnotations {
  private annotations: DatadogAnnotationsInterface = {};
  private readonly projectName: string;

  constructor(projectName: string) {
    this.projectName = projectName;
  }

  public withLinkerdIntegration(source?: string): DatadogAnnotations {
    this.withIntegration(
      source ? source : 'nginx',
      'linkerd',
      {},
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        prometheus_url: 'http://%%host%%:4191/metrics',
      },
    );

    return this;
  }

  public withNginxIntegration(port?: number): DatadogAnnotations {
    this.withIntegration(
      'nginx',
      'nginx',
      {},
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        nginx_status_url: `http://%%host%%:${port ?? 81}/nginx_status`,
      },
    );

    return this;
  }

  public withNginxHttpCheck(endpoint: string, isReviewApp: boolean): DatadogAnnotations {
    this.withHttpCheck('nginx', endpoint, isReviewApp);

    return this;
  }

  public withHttpCheck(source: string, endpoint: string, isReviewApp: boolean): DatadogAnnotations {
    if (!isReviewApp) {
      this.withIntegration(
        source,
        'http_check',
        {},
        {
          name: this.projectName,
          url: endpoint,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          tls_verify: true,
        },
      );
    }

    return this;
  }

  public withIntegration(type: string, name: string, initConfig: any, instances: any): DatadogAnnotations {
    if (this.annotations[`ad.datadoghq.com/${type}.check_names`]) {
      this.annotations[`ad.datadoghq.com/${type}.check_names`].push(name);
      this.annotations[`ad.datadoghq.com/${type}.init_configs`].push(initConfig);
      this.annotations[`ad.datadoghq.com/${type}.instances`].push(instances);
    } else {
      this.annotations[`ad.datadoghq.com/${type}.check_names`] = [name];
      this.annotations[`ad.datadoghq.com/${type}.init_configs`] = [initConfig];
      this.annotations[`ad.datadoghq.com/${type}.instances`] = [instances];
    }

    return this;
  }

  /**
   * @param container
   * @param source Not setting this is deprecated
   */
  public withLogs(container: string, source?: string): DatadogAnnotations {
    source = source ?? container;
    this.annotations[`ad.datadoghq.com/${container}.logs`] = [{ source: source, service: this.projectName }];

    return this;
  }

  public withNginxLogs(): DatadogAnnotations {
    this.withLogs('nginx');

    return this;
  }

  public withPhpFpmIntegration(port?: number): DatadogAnnotations {
    this.withIntegration(
      'php',
      'php_fpm',
      {},
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        status_url: `http://%%host%%:${port ?? 81}/status`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ping_url: `http://%%host%%:${port ?? 81}/ping`,
      },
    );

    return this;
  }

  public withPhpLogs(): DatadogAnnotations {
    this.withLogs('php');

    return this;
  }

  public output(): { [key: string]: string } {
    return Object.keys(this.annotations).reduce((annotations: { [key: string]: string }, key) => {
      annotations[key] = JSON.stringify(this.annotations[key]);
      return annotations;
    }, {});
  }
}
