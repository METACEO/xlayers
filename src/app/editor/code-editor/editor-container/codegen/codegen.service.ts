import { Injectable } from '@angular/core';
import { AngularCodeGenService } from './angular/angular.service';
import { ReactCodeGenService } from './react/react.service';
import { VueCodeGenService } from './vue/vue.service';
import { WCCodeGenService } from './wc/wc.service';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { Store } from '@ngxs/store';
import { UiState } from 'src/app/core/state';
import { environment } from 'src/environments/environment.hmr';

export interface XlayersNgxEditorModel extends NgxEditorModel {
  kind: 'angular' | 'react' | 'vue' | 'wc' | 'html' | 'text';
}

export interface CodeGenFacade {
  generate(ast: SketchMSLayer): Array<XlayersNgxEditorModel>;
}

@Injectable({
  providedIn: 'root'
})
export class CodeGenService {
  static Kind = {
    Unknown: 0,
    Angular: 1,
    React: 2,
    Vue: 3,
    WC: 4
  };

  private ast: SketchMSLayer;

  constructor(
    private readonly angular: AngularCodeGenService,
    private readonly react: ReactCodeGenService,
    private readonly vue: VueCodeGenService,
    private readonly wc: WCCodeGenService,
    private readonly store: Store
  ) {
    this.store
      .select(UiState.currentPage)
      .subscribe((currentPage: SketchMSLayer) => {
        if (currentPage) {
          this.ast = this.generateCssClassNames(currentPage);
        }
      });
  }

  private addHeaderInfo(content: Array<XlayersNgxEditorModel>) {
    return content.map(file => {
      const message = 'File auto-generated by xLayers.app';
      const version = `Build: ${environment.version}`;
      const date = `Date: ${new Date().toLocaleString()}`;
      const comment = {
        start: '//',
        end: ''
      };
      if (file.language.includes('html')) {
        comment.start = '<!--';
        comment.end = '-->';
      } else if (file.language.includes('css')) {
        comment.start = '/*';
        comment.end = '*/';
      }

      file.value = [
        `${comment.start} ${message} ${comment.end}`,
        `${comment.start} ${version} ${comment.end}`,
        `${comment.start} ${date} ${comment.end}`,
        '',
        file.value
      ].join('\n');

      return file;
    });
  }

  private generateCssClassNames(ast: SketchMSLayer) {
    function randomString() {
      return Math.random()
        .toString(36)
        .substring(2, 6);
    }

    function addCssClassNames(_ast: SketchMSLayer) {
      if (_ast.layers && _ast.layers.length > 0) {
        _ast.layers.forEach(layer => {
          if (layer.css) {
            (layer as any).css__className = `xly_${randomString()}`;
          }
          addCssClassNames(layer);
        });
      }
      return _ast;
    }

    return addCssClassNames(ast);
  }

  generate(kind: number): Array<XlayersNgxEditorModel> {
    switch (kind) {
      case CodeGenService.Kind.Angular:
        return this.addHeaderInfo(this.angular.generate(this.ast));
      case CodeGenService.Kind.React:
        return this.addHeaderInfo(this.react.generate(this.ast));
      case CodeGenService.Kind.Vue:
        return this.addHeaderInfo(this.vue.generate(this.ast));
      case CodeGenService.Kind.WC:
        return this.addHeaderInfo(this.wc.generate(this.ast));
    }
  }
}
