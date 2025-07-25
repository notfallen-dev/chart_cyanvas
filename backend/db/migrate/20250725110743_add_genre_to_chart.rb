class AddGenreToChart < ActiveRecord::Migration[8.0]
  def change
    add_column :charts, :genre, :integer, null: false, default: 0
  end
end
