class CreateRooms < ActiveRecord::Migration[6.0]
  def change
    create_table :rooms do |t|
      t.references :parent, polymorphic: true
      t.string :name
      t.timestamps
    end
  end
end
