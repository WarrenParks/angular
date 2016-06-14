import {Injector} from 'angular2/src/core/di';
import {Type, CONST, isPresent, isBlank} from 'angular2/src/facade/lang';
import {unimplemented} from 'angular2/src/facade/exceptions';
import {ElementRef} from './element_ref';
import {ViewRef, ViewRef_} from './view_ref';
import {AppElement} from './element';
import {ViewUtils} from './view_utils';
import {ChangeDetectorRef} from '../change_detection/change_detection';
import {reflector} from 'angular2/src/core/reflection/reflection';

/**
 * Represents an instance of a Component created via a {@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {@link #destroy}
 * method.
 */
export abstract class ComponentRef {
  /**
   * Location of the Host Element of this Component Instance.
   */
  get location(): ElementRef { return unimplemented(); }

  /**
   * The injector on which the component instance exists.
   */
  get injector(): Injector { return unimplemented(); }

  /**
   * The instance of the Component.
   */
  get instance(): any { return unimplemented(); };

  /**
   * The {@link ViewRef} of the Host View of this Component instance.
   */
  get hostView(): ViewRef { return unimplemented(); };

  /**
   * The {@link ChangeDetectorRef} of the Component instance.
   */
  get changeDetectorRef(): ChangeDetectorRef { return unimplemented(); }

  /**
   * The component type.
   */
  get componentType(): Type { return unimplemented(); }

  /**
   * Destroys the component instance and all of the data structures associated with it.
   */
  abstract destroy(): void;

  /**
   * Allows to register a callback that will be called when the component is destroyed.
   */
  abstract onDestroy(callback: Function): void;
}

export class ComponentRef_ extends ComponentRef {
  constructor(private _hostElement: AppElement, private _componentType: Type,
              private _metadata: any[]) {
    super();
  }
  get location(): ElementRef { return this._hostElement.elementRef; }
  get injector(): Injector { return this._hostElement.injector; }
  get instance(): any { return this._hostElement.component; };
  get hostView(): ViewRef { return this._hostElement.parentView.ref; };
  get changeDetectorRef(): ChangeDetectorRef { return this._hostElement.parentView.ref; };
  get componentType(): Type { return this._componentType; }
  get metadata(): any[] { return this._metadata; }

  destroy(): void { this._hostElement.parentView.destroy(); }
  onDestroy(callback: Function): void { this.hostView.onDestroy(callback); }
}

@CONST()
export class ComponentFactory {
  static cloneWithMetadata(original: ComponentFactory, metadata: any[]): ComponentFactory {
    return new ComponentFactory(original.selector, original._viewFactory, original._componentType,
                                [original.componentType, metadata]);
  }

  // Note: can't use a Map for the metadata due to
  // https://github.com/dart-lang/sdk/issues/21553
  constructor(public selector: string, private _viewFactory: Function, private _componentType: Type,
              private _metadataPairs: Array<Type | any[]> = null) {}

  get componentType(): Type { return this._componentType; }
  get metadata(): any[] {
    if (isPresent(this._metadataPairs)) {
      for (var i = 0; i < this._metadataPairs.length; i += 2) {
        if (this._metadataPairs[i] === this._componentType) {
          return <any[]>this._metadataPairs[i + 1];
        }
      }
      return [];
    } else {
      return reflector.annotations(this._componentType);
    }
  }

  /**
   * Creates a new component.
   */
  create(injector: Injector, projectableNodes: any[][] = null,
         rootSelectorOrNode: string | any = null): ComponentRef {
    var vu: ViewUtils = injector.get(ViewUtils);
    if (isBlank(projectableNodes)) {
      projectableNodes = [];
    }
    // Note: Host views don't need a declarationAppElement!
    var hostView = this._viewFactory(vu, injector, null);
    var hostElement = hostView.create(projectableNodes, rootSelectorOrNode);
    return new ComponentRef_(hostElement, this.componentType, this.metadata);
  }
}