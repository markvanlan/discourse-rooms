# frozen_string_literal: true

# name: discourse-rooms
# about: Audio/video rooms for Discourse
# version: 0.0.1
# authors: Mark VanLandingham
# url: https://github.com/markvanlan/discourse-rooms

enabled_site_setting :rooms_enabled

after_initialize do
  [
    "../app/models/room",
    "../app/controllers/rooms_controller"
  ].each { |path| require File.expand_path(path, __FILE__) }

  module ::Rooms
    PLUGIN_NAME ||= "discourse-rooms".freeze

    class Engine < ::Rails::Engine
      engine_name Rooms::PLUGIN_NAME
      isolate_namespace Rooms
    end
  end

  Rooms::Engine.routes.draw do
  end

  Discourse::Application.routes.append do
    mount ::Rooms::Engine, at: "/rooms"
    get "/g/:group_name/room" => "rooms/rooms#for_group"
    post "/g/:group_name/room" => "rooms/rooms#message"
  end
end
